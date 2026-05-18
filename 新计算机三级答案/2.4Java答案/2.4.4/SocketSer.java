import java.io.*;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.Scanner;

public class SocketSer {
    public static void main(String[] args) throws IOException {
        ServerSocket serverSocket = new ServerSocket();// 创建服务端套接字
        serverSocket.bind(new InetSocketAddress("127.0.0.1",8000),100);// 绑定地址
        System.out.println("服务端端口号：8000等待连接。。。");
        while (true){
            final Socket theSocket = serverSocket.accept(); // 循环获取客户端链接
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        System.out.println("连接已建立!");
                        clientConnectionThread(theSocket);//在单独的线程中处理
                    }catch (Exception ex){
                        ex.printStackTrace();
                    }finally {
                        try {
                            theSocket.close(); // 确保socket关闭
                        } catch (IOException e) {
                        }
                        System.out.println("连接已断开!");
                    }
                }
            }).start();
        }
    }

    public static void clientConnectionThread(final Socket socket) throws IOException {
        // 获取发送流
        final DataOutputStream dos = new DataOutputStream(socket.getOutputStream());
        // 获取接收流
        final DataInputStream dis = new DataInputStream(socket.getInputStream());


        Thread receiveThread = new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                        while (true) {
                            String msg = dis.readUTF();
                            System.out.println(msg);

                            if (msg.equals("bye")) {

                                socket.close();
                                return;
                            }
                        }
                } catch (IOException e) {

                }
            }
        });
        Thread sendThread = new Thread(new Runnable() {
            @Override
            public void run() {
                Scanner scanner = new Scanner(System.in);
                while (true){

                    String msg = scanner.nextLine();
                    try {
                        dos.writeUTF(msg);
                        dos.flush();
                    } catch (IOException e) {

                    }
                    if(msg.equals("bye")){
                        try {
                            socket.close();
                        } catch (IOException e) {
                        }
                        return;
                    }
                }
            }
        });

        receiveThread.start();
        sendThread.start();
        try {
            receiveThread.join();
        } catch (InterruptedException e) {
        }
        sendThread.interrupt();
    }
}
