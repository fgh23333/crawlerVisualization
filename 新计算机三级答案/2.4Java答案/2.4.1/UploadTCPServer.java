import java.io.*;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;

public class UploadTCPServer {
    public static void main(String[] args) throws IOException {
        ServerSocket serverSocket = new ServerSocket();// 创建服务端套接字
        serverSocket.bind(new InetSocketAddress("127.0.0.1",10001),100);// 绑定地址
        System.out.println("服务端已启动");
        while (true){
            final Socket theSocket = serverSocket.accept(); // 循环获取客户端链接
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        clientConnectionThread(theSocket);//在单独的线程中处理
                    }catch (Exception ex){
                        ex.printStackTrace();
                    }finally {
                        try {
                            theSocket.close(); // 确保socket关闭
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    }
                }
            }).start();
        }
    }

    public static void clientConnectionThread(Socket socket) throws IOException {
        // 获取发送流
        DataOutputStream dos = new DataOutputStream(socket.getOutputStream());
        // 获取接收流
        DataInputStream dis = new DataInputStream(socket.getInputStream());

        // 客户端的协议：首先上传一个int，代表文件的长度，随后上传文件的字节数据
        int fileLen = dis.readInt();
        // 直接创建一个文件一样大的缓冲区
        byte[] fileData = new byte[fileLen];
        // 读取文件数据
        dis.readFully(fileData);

        // 保存上传的文件
        // 首先创建目录
        File dir = new File("D:\\upload");
        if(!dir.exists()){
            dir.mkdirs();
        }
        // 创建要保存的文件
        FileOutputStream fos = new FileOutputStream(new File(dir,System.currentTimeMillis()+".jpg"));
        try{
            fos.write(fileData);
            fos.flush();
        }finally {
            fos.close();
        }


        // 发送回复
        dos.writeUTF("上传成功");
        dos.flush();
    }
}
