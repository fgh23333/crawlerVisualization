import java.io.*;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.Scanner;

public class SocketClient {
    public static void main(String[] args) throws IOException {


        final Socket socket = new Socket();
        socket.connect(new InetSocketAddress("127.0.0.1",8000));
        System.out.println("客户端已和服务端建立连接");
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

                            System.out.println("连接已断开！");
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
                            System.out.println("连接已断开！");
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
        // 完成，关闭socket。
        socket.close();

    }
}
